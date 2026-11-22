from typing import Any


def make_run(run_id: str = "run-1", *, verdict: str = "PASS", seed: int = 1) -> dict[str, Any]:
    events = [
        {"id": 1, "virtualTime": 100, "type": "BECOME_LEADER", "nodeId": 1, "details": "leader elected"},
        {"id": 2, "virtualTime": 200, "type": "HEARTBEAT_SENT", "nodeId": 1, "details": "heartbeat"},
    ]
    return {
        "id": run_id,
        "scenarioTitle": f"Scenario {run_id}",
        "timestamp": f"2026-11-22T12:00:0{seed}Z",
        "seed": seed,
        "clusterSize": 3,
        "virtualDuration": 200,
        "executionDuration": 20,
        "eventCount": len(events),
        "verdict": verdict,
        "leaderChanges": 1,
        "messagesSent": 3,
        "messagesDropped": 0,
        "clientSuccess": 1,
        "clientErrors": 0,
        "linearizabilityPassed": True,
        "invariants": [
            {
                "id": "INV01",
                "name": "Election Safety",
                "status": "PASS",
                "evidence": {"eventIds": [1]},
            }
        ],
        "events": events,
        "snapshots": [{"time": 200, "nodes": [{"id": 1, "role": "LEADER"}]}],
    }


def make_scenario(title: str = "Partition Recovery") -> dict[str, Any]:
    return {
        "title": title,
        "category": "Partitions",
        "difficulty": "Intermediate",
        "description": "Exercise a network partition.",
        "goal": "Check cluster recovery.",
        "clusterSize": 5,
        "expectedVerdict": "PASS",
        "config": {"clusterSize": 5, "seed": 42},
        "faultScript": [{"timeMs": 500, "action": "HEAL"}],
        "workload": [{"timeMs": 600, "command": "GET key"}],
    }


def test_health_and_empty_admin_overview(client):
    assert client.get("/api/v1/health").json() == {"status": "ok", "database": "sqlite"}
    overview = client.get("/api/v1/admin/overview")
    assert overview.status_code == 200
    assert overview.json()["tables"] == {
        "runs": 0,
        "runEvents": 0,
        "nodeSnapshots": 0,
        "invariantResults": 0,
        "scenarios": 0,
    }


def test_create_run_persists_metadata_events_snapshots_and_invariants(client):
    response = client.post("/api/v1/runs", json=make_run())

    assert response.status_code == 201
    assert response.json()["scenarioTitle"] == "Scenario run-1"
    assert response.json()["eventCount"] == 2

    detail = client.get("/api/v1/runs/run-1")
    assert detail.status_code == 200
    assert detail.json()["invariants"][0]["id"] == "INV01"
    assert detail.json()["snapshots"][0]["nodes"][0]["role"] == "LEADER"
    assert "events" not in detail.json()

    page = client.get("/api/v1/runs/run-1/events?limit=1&offset=1")
    assert page.status_code == 200
    assert page.json()["total"] == 2
    assert page.json()["items"][0]["type"] == "HEARTBEAT_SENT"

    assert client.get("/api/v1/admin/overview").json()["tables"] == {
        "runs": 1,
        "runEvents": 2,
        "nodeSnapshots": 1,
        "invariantResults": 1,
        "scenarios": 0,
    }


def test_run_list_is_paginated_and_ordered_newest_first(client):
    assert client.post("/api/v1/runs", json=make_run("run-1", seed=1)).status_code == 201
    assert client.post("/api/v1/runs", json=make_run("run-2", seed=2)).status_code == 201
    assert client.post("/api/v1/runs", json=make_run("run-3", seed=3)).status_code == 201

    page = client.get("/api/v1/runs?limit=2&offset=1")
    assert page.status_code == 200
    assert page.json()["total"] == 3
    assert [run["id"] for run in page.json()["items"]] == ["run-2", "run-1"]


def test_run_validation_rejects_mismatched_event_counts_and_invalid_cluster_sizes(client):
    mismatched_count = make_run()
    mismatched_count["eventCount"] = 10
    assert client.post("/api/v1/runs", json=mismatched_count).status_code == 422

    invalid_cluster = make_run("run-invalid-cluster")
    invalid_cluster["clusterSize"] = 4
    assert client.post("/api/v1/runs", json=invalid_cluster).status_code == 422

    invalid_limit = client.get("/api/v1/runs?limit=101")
    assert invalid_limit.status_code == 422


def test_duplicate_run_conflicts_and_missing_run_resources_return_404(client):
    assert client.post("/api/v1/runs", json=make_run()).status_code == 201
    assert client.post("/api/v1/runs", json=make_run()).status_code == 409
    assert client.get("/api/v1/runs/not-found").status_code == 404
    assert client.get("/api/v1/runs/not-found/events").status_code == 404
    assert client.delete("/api/v1/runs/not-found").status_code == 404


def test_delete_run_cascades_to_events_snapshots_and_invariants(client):
    assert client.post("/api/v1/runs", json=make_run()).status_code == 201

    assert client.delete("/api/v1/runs/run-1").status_code == 204
    assert client.get("/api/v1/runs/run-1").status_code == 404
    assert client.get("/api/v1/admin/overview").json()["tables"] == {
        "runs": 0,
        "runEvents": 0,
        "nodeSnapshots": 0,
        "invariantResults": 0,
        "scenarios": 0,
    }


def test_scenario_create_list_update_and_delete(client):
    created = client.post("/api/v1/scenarios", json=make_scenario())
    assert created.status_code == 201
    scenario = created.json()
    assert scenario["id"].startswith("custom-")
    assert scenario["faultScript"][0]["action"] == "HEAL"

    listed = client.get("/api/v1/scenarios")
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == scenario["id"]

    updated = client.patch(
        f"/api/v1/scenarios/{scenario['id']}",
        json=make_scenario("Updated Scenario"),
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Scenario"

    assert client.delete(f"/api/v1/scenarios/{scenario['id']}").status_code == 204
    assert client.get("/api/v1/scenarios").json() == []
    assert client.delete(f"/api/v1/scenarios/{scenario['id']}").status_code == 404


def test_scenario_validation_rejects_invalid_cluster_and_unknown_scenario(client):
    invalid = make_scenario()
    invalid["clusterSize"] = 4
    assert client.post("/api/v1/scenarios", json=invalid).status_code == 422
    assert client.patch("/api/v1/scenarios/missing", json=make_scenario()).status_code == 404

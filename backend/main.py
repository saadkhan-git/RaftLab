import os
from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


ROOT = Path(__file__).resolve().parent
DATABASE_FILE = ROOT / "data" / "raftlab.db"
DATABASE_FILE.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_FILE}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    scenario_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    scenario_title: Mapped[str] = mapped_column(String(200))
    timestamp: Mapped[str] = mapped_column(String(40), index=True)
    seed: Mapped[int] = mapped_column(Integer)
    cluster_size: Mapped[int] = mapped_column(Integer)
    virtual_duration: Mapped[int] = mapped_column(Integer)
    execution_duration: Mapped[int] = mapped_column(Integer)
    event_count: Mapped[int] = mapped_column(Integer)
    verdict: Mapped[str] = mapped_column(String(30), index=True)
    leader_changes: Mapped[int] = mapped_column(Integer)
    messages_sent: Mapped[int] = mapped_column(Integer)
    messages_dropped: Mapped[int] = mapped_column(Integer)
    client_success: Mapped[int] = mapped_column(Integer)
    client_errors: Mapped[int] = mapped_column(Integer)
    linearizability_passed: Mapped[bool] = mapped_column(Boolean)
    invariants_json: Mapped[str] = mapped_column(Text)
    events: Mapped[list["RunEvent"]] = relationship(
        back_populates="run", cascade="all, delete-orphan", order_by="RunEvent.sequence_number"
    )
    snapshots: Mapped[list["NodeSnapshot"]] = relationship(
        back_populates="run", cascade="all, delete-orphan", order_by="NodeSnapshot.sequence_number"
    )
    invariant_results: Mapped[list["InvariantResult"]] = relationship(
        back_populates="run", cascade="all, delete-orphan", order_by="InvariantResult.id"
    )


class RunEvent(Base):
    __tablename__ = "run_events"
    __table_args__ = (
        Index("ix_run_events_run_time", "run_id", "virtual_time"),
        Index("ix_run_events_run_type", "run_id", "event_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id", ondelete="CASCADE"), index=True)
    sequence_number: Mapped[int] = mapped_column(Integer)
    event_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    virtual_time: Mapped[int] = mapped_column(Integer)
    event_type: Mapped[str] = mapped_column(String(60))
    source_node: Mapped[int | None] = mapped_column(Integer, nullable=True)
    destination_node: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payload_json: Mapped[str] = mapped_column(Text)
    run: Mapped[Run] = relationship(back_populates="events")


class NodeSnapshot(Base):
    __tablename__ = "node_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id", ondelete="CASCADE"), index=True)
    sequence_number: Mapped[int] = mapped_column(Integer)
    virtual_time: Mapped[int] = mapped_column(Integer)
    nodes_json: Mapped[str] = mapped_column(Text)
    run: Mapped[Run] = relationship(back_populates="snapshots")


class InvariantResult(Base):
    __tablename__ = "invariant_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id", ondelete="CASCADE"), index=True)
    invariant_id: Mapped[str] = mapped_column(String(30), index=True)
    status: Mapped[str] = mapped_column(String(20))
    event_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details_json: Mapped[str] = mapped_column(Text)
    run: Mapped[Run] = relationship(back_populates="invariant_results")


class SavedScenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    category: Mapped[str] = mapped_column(String(60))
    difficulty: Mapped[str] = mapped_column(String(30))
    cluster_size: Mapped[int] = mapped_column(Integer)
    expected_verdict: Mapped[str] = mapped_column(String(30))
    description: Mapped[str] = mapped_column(Text)
    goal: Mapped[str] = mapped_column(Text)
    definition_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=lambda name: "".join(
        word.capitalize() if index else word for index, word in enumerate(name.split("_"))
    ), populate_by_name=True)


VerdictValue = Literal["PASS", "SAFETY_FAIL", "LIVENESS_FAIL", "TIMEOUT", "HARNESS_FAIL"]


class RunCreate(ApiModel):
    id: str = Field(min_length=1, max_length=120)
    scenario_id: str | None = Field(default=None, max_length=120)
    scenario_title: str = Field(min_length=1, max_length=200)
    timestamp: str = Field(min_length=1, max_length=40)
    seed: int
    cluster_size: Literal[3, 5, 7, 9]
    virtual_duration: int = Field(ge=0, le=3_600_000)
    execution_duration: int = Field(ge=0, le=3_600_000)
    event_count: int = Field(ge=0, le=50_000)
    verdict: VerdictValue
    leader_changes: int = Field(ge=0)
    messages_sent: int = Field(ge=0)
    messages_dropped: int = Field(ge=0)
    client_success: int = Field(ge=0)
    client_errors: int = Field(ge=0)
    invariants: list[dict[str, Any]] = Field(max_length=100)
    linearizability_passed: bool
    events: list[dict[str, Any]] = Field(max_length=50_000)
    snapshots: list[dict[str, Any]] = Field(max_length=5_000)


class RunSummary(ApiModel):
    id: str
    scenario_id: str | None
    scenario_title: str
    timestamp: str
    seed: int
    cluster_size: int
    virtual_duration: int
    execution_duration: int
    event_count: int
    verdict: str
    leader_changes: int
    messages_sent: int
    messages_dropped: int
    client_success: int
    client_errors: int
    linearizability_passed: bool


class RunPage(ApiModel):
    items: list[RunSummary]
    total: int
    limit: int
    offset: int


class RunEventPage(ApiModel):
    items: list[dict[str, Any]]
    total: int
    limit: int
    offset: int


class ScenarioCreate(ApiModel):
    title: str = Field(min_length=1, max_length=200)
    category: Literal["Elections", "Partitions", "Replication", "Storage Faults", "Linearizability"]
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    description: str = Field(min_length=1, max_length=2_000)
    goal: str = Field(min_length=1, max_length=2_000)
    cluster_size: Literal[3, 5, 7, 9]
    expected_verdict: VerdictValue = "PASS"
    config: dict[str, Any] = Field(default_factory=dict)
    fault_script: list[dict[str, Any]] = Field(default_factory=list, max_length=500)
    workload: list[dict[str, Any]] = Field(default_factory=list, max_length=2_000)


class ScenarioRecord(ScenarioCreate):
    id: str
    created_at: datetime
    updated_at: datetime


app = FastAPI(title="RaftLab API", version="1.0.0")
allowed_origins = os.getenv("RAFTLAB_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)

Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_summary(run: Run) -> dict[str, Any]:
    return {
        "id": run.id,
        "scenarioId": run.scenario_id,
        "scenarioTitle": run.scenario_title,
        "timestamp": run.timestamp,
        "seed": run.seed,
        "clusterSize": run.cluster_size,
        "virtualDuration": run.virtual_duration,
        "executionDuration": run.execution_duration,
        "eventCount": run.event_count,
        "verdict": run.verdict,
        "leaderChanges": run.leader_changes,
        "messagesSent": run.messages_sent,
        "messagesDropped": run.messages_dropped,
        "clientSuccess": run.client_success,
        "clientErrors": run.client_errors,
        "linearizabilityPassed": run.linearizability_passed,
    }


def scenario_record(scenario: SavedScenario) -> dict[str, Any]:
    import json

    data = json.loads(scenario.definition_json)
    return {
        **data,
        "id": scenario.id,
        "createdAt": scenario.created_at,
        "updatedAt": scenario.updated_at,
    }


def invariant_event_id(invariant: dict[str, Any]) -> int | None:
    evidence = invariant.get("evidence")
    event_ids = evidence.get("eventIds") if isinstance(evidence, dict) else None
    if isinstance(event_ids, list) and event_ids and isinstance(event_ids[0], int):
        return event_ids[0]
    return None


@app.get("/api/v1/health")
def health(db: Session = Depends(get_db)) -> dict[str, Any]:
    db.execute(select(func.count()).select_from(Run)).scalar_one()
    return {"status": "ok", "database": engine.dialect.name}


@app.get("/api/v1/admin/overview")
def admin_overview(db: Session = Depends(get_db)) -> dict[str, Any]:
    tables = {
        "runs": db.scalar(select(func.count()).select_from(Run)) or 0,
        "runEvents": db.scalar(select(func.count()).select_from(RunEvent)) or 0,
        "nodeSnapshots": db.scalar(select(func.count()).select_from(NodeSnapshot)) or 0,
        "invariantResults": db.scalar(select(func.count()).select_from(InvariantResult)) or 0,
        "scenarios": db.scalar(select(func.count()).select_from(SavedScenario)) or 0,
    }
    return {
        "database": engine.dialect.name,
        "tables": tables,
        "totalRuns": tables["runs"],
        "passRuns": db.scalar(select(func.count()).select_from(Run).where(Run.verdict == "PASS")) or 0,
        "failedRuns": db.scalar(select(func.count()).select_from(Run).where(Run.verdict != "PASS")) or 0,
        "totalEvents": tables["runEvents"],
        "recentRuns": [run_summary(run) for run in db.scalars(select(Run).order_by(Run.timestamp.desc()).limit(8))],
    }


@app.get("/api/v1/runs", response_model=RunPage)
def list_runs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    total = db.scalar(select(func.count()).select_from(Run)) or 0
    runs = db.scalars(select(Run).order_by(Run.timestamp.desc()).offset(offset).limit(limit)).all()
    return {"items": [run_summary(run) for run in runs], "total": total, "limit": limit, "offset": offset}


@app.post("/api/v1/runs", response_model=RunSummary, status_code=201)
def create_run(payload: RunCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    import json

    if payload.event_count != len(payload.events):
        raise HTTPException(status_code=422, detail="eventCount must match the number of submitted events")
    if db.get(Run, payload.id) is not None:
        raise HTTPException(status_code=409, detail="A run with this id already exists")

    run = Run(
        id=payload.id,
        scenario_id=payload.scenario_id,
        scenario_title=payload.scenario_title,
        timestamp=payload.timestamp,
        seed=payload.seed,
        cluster_size=payload.cluster_size,
        virtual_duration=payload.virtual_duration,
        execution_duration=payload.execution_duration,
        event_count=payload.event_count,
        verdict=payload.verdict,
        leader_changes=payload.leader_changes,
        messages_sent=payload.messages_sent,
        messages_dropped=payload.messages_dropped,
        client_success=payload.client_success,
        client_errors=payload.client_errors,
        linearizability_passed=payload.linearizability_passed,
        invariants_json=json.dumps(payload.invariants, separators=(",", ":")),
    )
    run.events = [
        RunEvent(
            sequence_number=index,
            event_id=event.get("id"),
            virtual_time=event.get("virtualTime", 0),
            event_type=event.get("type", "UNKNOWN"),
            source_node=event.get("nodeId"),
            destination_node=event.get("targetId"),
            payload_json=json.dumps(event, separators=(",", ":")),
        )
        for index, event in enumerate(payload.events)
    ]
    run.snapshots = [
        NodeSnapshot(
            sequence_number=index,
            virtual_time=snapshot.get("time", 0),
            nodes_json=json.dumps(snapshot.get("nodes", []), separators=(",", ":")),
        )
        for index, snapshot in enumerate(payload.snapshots)
    ]
    run.invariant_results = [
        InvariantResult(
            invariant_id=invariant.get("id", "UNKNOWN"),
            status=invariant.get("status", "NOT_TESTED"),
            event_id=invariant_event_id(invariant),
            details_json=json.dumps(invariant, separators=(",", ":")),
        )
        for invariant in payload.invariants
    ]
    db.add(run)
    db.commit()
    return run_summary(run)


@app.get("/api/v1/runs/{run_id}")
def get_run(run_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    import json

    run = db.get(Run, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        **run_summary(run),
        "invariants": [json.loads(result.details_json) for result in run.invariant_results]
        if run.invariant_results
        else json.loads(run.invariants_json),
        "snapshots": [{"time": snapshot.virtual_time, "nodes": json.loads(snapshot.nodes_json)} for snapshot in run.snapshots],
    }


@app.get("/api/v1/runs/{run_id}/events", response_model=RunEventPage)
def list_run_events(
    run_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    import json

    if db.get(Run, run_id) is None:
        raise HTTPException(status_code=404, detail="Run not found")
    total = db.scalar(select(func.count()).select_from(RunEvent).where(RunEvent.run_id == run_id)) or 0
    events = db.scalars(
        select(RunEvent)
        .where(RunEvent.run_id == run_id)
        .order_by(RunEvent.sequence_number)
        .offset(offset)
        .limit(limit)
    ).all()
    return {
        "items": [json.loads(event.payload_json) for event in events],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.delete("/api/v1/runs/{run_id}", status_code=204)
def delete_run(run_id: str, db: Session = Depends(get_db)) -> Response:
    run = db.get(Run, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    db.delete(run)
    db.commit()
    return Response(status_code=204)


@app.get("/api/v1/scenarios", response_model=list[ScenarioRecord])
def list_scenarios(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return [scenario_record(scenario) for scenario in db.scalars(select(SavedScenario).order_by(SavedScenario.updated_at.desc())).all()]


@app.post("/api/v1/scenarios", response_model=ScenarioRecord, status_code=201)
def create_scenario(payload: ScenarioCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    import json

    now = datetime.now(timezone.utc)
    scenario = SavedScenario(
        id=f"custom-{uuid4().hex}",
        title=payload.title,
        category=payload.category,
        difficulty=payload.difficulty,
        cluster_size=payload.cluster_size,
        expected_verdict=payload.expected_verdict,
        description=payload.description,
        goal=payload.goal,
        definition_json=json.dumps(payload.model_dump(by_alias=True), separators=(",", ":")),
        created_at=now,
        updated_at=now,
    )
    db.add(scenario)
    db.commit()
    return scenario_record(scenario)


@app.patch("/api/v1/scenarios/{scenario_id}", response_model=ScenarioRecord)
def update_scenario(scenario_id: str, payload: ScenarioCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    import json

    scenario = db.get(SavedScenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    for field in ("title", "category", "difficulty", "cluster_size", "expected_verdict", "description", "goal"):
        setattr(scenario, field, getattr(payload, field))
    scenario.definition_json = json.dumps(payload.model_dump(by_alias=True), separators=(",", ":"))
    scenario.updated_at = datetime.now(timezone.utc)
    db.commit()
    return scenario_record(scenario)


@app.delete("/api/v1/scenarios/{scenario_id}", status_code=204)
def delete_scenario(scenario_id: str, db: Session = Depends(get_db)) -> Response:
    scenario = db.get(SavedScenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(scenario)
    db.commit()
    return Response(status_code=204)

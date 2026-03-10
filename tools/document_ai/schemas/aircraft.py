from typing import List, Optional

from pydantic import BaseModel, Field


class WBStation(BaseModel):
    name: str
    arm: float
    max_weight: float


class VSpeedData(BaseModel):
    Vr: Optional[str] = None
    Vx: Optional[str] = None
    Vy: Optional[str] = None
    Va: Optional[str] = None
    Vs: Optional[str] = None
    Vso: Optional[str] = None
    Vfe: Optional[str] = None
    Vno: Optional[str] = None
    Vne: Optional[str] = None
    best_glide: Optional[str] = None
    climb: Optional[str] = None
    max_crosswind: Optional[str] = None


class AircraftData(BaseModel):
    registration: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    empty_weight: Optional[float] = None
    max_takeoff_weight: Optional[float] = None
    useful_load: Optional[float] = None
    max_passengers: Optional[int] = None
    luggage_capacity_lbs: Optional[float] = None
    fuel_capacity_gallons: Optional[float] = None
    fuel_usable_gallons: Optional[float] = None
    fuel_weight_lbs: Optional[float] = None
    fuel_per_wing_gallons: Optional[float] = None
    oil_capacity_quarts: Optional[str] = None
    max_endurance_hours: Optional[float] = None
    v_speeds: VSpeedData = Field(default_factory=VSpeedData)
    stations: List[WBStation] = Field(default_factory=list)
    notes: Optional[str] = None

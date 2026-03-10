from typing import Optional

from pydantic import BaseModel


class PartsOrderData(BaseModel):
    part_name: Optional[str] = None
    part_number: Optional[str] = None
    supplier: Optional[str] = None
    order_date: Optional[str] = None
    estimated_arrival: Optional[str] = None
    cost: Optional[float] = None

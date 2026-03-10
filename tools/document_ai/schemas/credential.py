from typing import Optional

from pydantic import BaseModel


class CredentialData(BaseModel):
    document_type: Optional[str] = None
    holder_name: Optional[str] = None
    expiry_date: Optional[str] = None
    medical_class: Optional[str] = None
    certificate_number: Optional[str] = None

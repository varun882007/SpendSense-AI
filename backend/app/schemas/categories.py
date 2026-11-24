from pydantic import BaseModel


class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str

    model_config = {"from_attributes": True}

-- User names are login identifiers and must be globally unique.
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

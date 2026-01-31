ALTER TABLE "clients"
ALTER COLUMN "deal_value"
SET DATA TYPE integer
USING deal_value::integer;

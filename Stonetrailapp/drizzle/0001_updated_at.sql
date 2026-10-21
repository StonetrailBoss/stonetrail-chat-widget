
CREATE FUNCTION portal_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END $$;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "staff_role" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "session" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "account" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "verification" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "inventory_item" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "timeclock_entry" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "employee_rate" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "accounts_payable" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "petty_cash_account" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "petty_cash_entry" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "nis_rate" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON "employee_deduction" FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at();
-- Consolidate section labels by tier
-- SP is already SP ✓
-- PR is already PR ✓
-- AD is already AD ✓
-- RG1, RG2, RG3, RG4, RG5 → RG

BEGIN;

UPDATE public.seats
SET section_label = 'RG'
WHERE section_label IN ('RG1', 'RG2', 'RG3', 'RG4', 'RG5');

COMMIT;

# TODO — AXIONYX BID COMPILER ENGINE (ABCE) v1.0

## Step 1 — Create ABCE directory structure ✅
- Create `axis_clean/AXIONYX_BID_COMPILER/`
- Add subfolders: `compiler/`, `templates/`, `context/`, `output/`


## Step 2 — Implement compiler layer (Python)
- Add `compiler/main.py`
- Add `compiler/context_loader.py`
- Add `compiler/document_builder.py`
- Add `compiler/pack_generator.py`

## Step 3 — Implement context layer (MEL-OS truth + SANAS alignment)
- Add `context/melos_truth_record.py`
- Add `context/sanas_alignment_context.py`

## Step 4 — Implement templates layer
- Add `templates/cover_letter.md`
- Add `templates/executive_summary.md`
- Add `templates/governance_model.md`
- Add `templates/legal_declaration.md`

## Step 5 — Deterministic rendering
- Use deterministic build date (env var `BUILD_DATE` or fallback to fixed date)

## Step 6 — Add entrypoint
- Add `axis_clean/AXIONYX_BID_COMPILER/run_build.bat`

## Step 7 — Convert existing BAT into delegation wrapper
- Update `axis_clean/generate_sanas_rfi_pack.bat` to call the ABCE engine only

## Step 8 — Validate output
- Run `axis_clean/AXIONYX_BID_COMPILER/run_build.bat`
- Confirm `output/SANAS_RFI_PACK/` artifacts exist and match expected naming

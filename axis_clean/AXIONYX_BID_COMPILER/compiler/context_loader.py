def load_context():
    # Import as top-level modules when ABCE is executed via run_build.bat
    # (cwd = AXIONYX_BID_COMPILER).
    from context.melos_truth_record import MEL_OS_TRUTH
    from context.sanas_alignment_context import SANAS_CONTEXT

    return {
        "company": MEL_OS_TRUTH,
        "sanas": SANAS_CONTEXT,
    }

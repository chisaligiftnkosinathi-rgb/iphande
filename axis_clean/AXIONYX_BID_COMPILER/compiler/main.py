from .context_loader import load_context
from .pack_generator import generate_pack


def main() -> None:
    print("AXIONYX BID COMPILER ENGINE (ABCE) v1.0 initializing...")
    context = load_context()
    output_dir = generate_pack(context)
    print(f"SANAS RFI pack generated: {output_dir}")


if __name__ == "__main__":
    main()

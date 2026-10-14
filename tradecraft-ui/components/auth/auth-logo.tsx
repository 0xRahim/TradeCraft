import Image from "next/image";
import Link from "next/link";

export function AuthLogo() {
  return (
    <Link
      href="/login"
      className="flex items-center gap-2 text-sm font-semibold tracking-tight"
    >
      <span className="size-6 flex-none overflow-hidden rounded-lg">
        <Image
          src="/images/light-logo.png"
          alt="TradeCraft"
          width={24}
          height={24}
          className="size-6"
        />
      </span>
      TradeCraft
    </Link>
  );
}

import Link from "next/link";

export function ActivateCouponButton({
  couponId,
  serviceId,
}: {
  couponId: string;
  serviceId: string | null;
}) {
  const href = serviceId
    ? `/portal/nuevo-pedido?coupon=${couponId}&service=${serviceId}`
    : `/portal/nuevo-pedido?coupon=${couponId}`;

  return (
    <Link
      href={href}
      className="mt-3 inline-block rounded-md bg-brand-black px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
    >
      Activar cupón
    </Link>
  );
}
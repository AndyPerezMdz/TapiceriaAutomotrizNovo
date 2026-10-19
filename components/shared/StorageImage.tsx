import Image, { type ImageProps } from "next/image";

const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/`;

type Props = Omit<ImageProps, "src"> & { src: string };

/**
 * next/image para fotos que vienen de la base de datos.
 * Optimiza las de Supabase Storage; cualquier otra URL (o una vista previa blob:)
 * se muestra tal cual, para no romper la página por un dominio no configurado.
 */
export function StorageImage({ src, alt, ...props }: Props) {
  const optimizable = storageBase.length > 30 && src.startsWith(storageBase);
  return <Image src={src} alt={alt} unoptimized={!optimizable} {...props} />;
}

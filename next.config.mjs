/** @type {import('next').NextConfig} */

// Хосты, с которых разрешено грузить изображения товаров. Раньше стоял
// `hostname: "**"`, из-за чего /_next/image работал как открытый прокси
// к любому внешнему адресу за счёт нашего сервера.
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "images.unsplash.com")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname }))
  }
};

export default nextConfig;

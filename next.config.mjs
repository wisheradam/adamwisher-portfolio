/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, {isServer, webpack}) {
    if (isServer && process.env.CHECKER_PRIVATE_CATALOG_KEY) {
      config.plugins.push(new webpack.DefinePlugin({
        "process.env.CHECKER_PRIVATE_CATALOG_KEY": JSON.stringify(process.env.CHECKER_PRIVATE_CATALOG_KEY)
      }));
    }
    return config;
  },
};

export default nextConfig;

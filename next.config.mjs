/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers(){
    return [
      {source:'/sitemap.xml',headers:[{key:'Cache-Control',value:'no-store, max-age=0'}]},
      ...['/admin/:path*','/api/:path*','/projects/:path*','/mail','/learning','/og'].map(source=>({source,headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]})),
    ];
  },
  serverExternalPackages: ["@electric-sql/pglite"],
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

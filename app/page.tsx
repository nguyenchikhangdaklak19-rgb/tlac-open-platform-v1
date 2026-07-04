// Placeholder landing page. The real landing (catalog, filter, search) is
// owned by another task — see spec/tlac-open-platform-v1.md Epic 1.
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          TLAC Open Platform
        </h1>
        <p className="mt-3 max-w-md text-base text-foreground/70">
          Danh mục năng lực MCP và Skill nội bộ TLAC — trang chủ đầy đủ đang
          được xây dựng.
        </p>
      </div>
    </div>
  );
}

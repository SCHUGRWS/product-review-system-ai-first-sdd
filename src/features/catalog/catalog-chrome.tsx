import { AppHeader } from "@/components/app-header";
import { parseCatalogParams, type RawSearchParams } from "./catalog-params";
import { requireCatalogUser } from "./catalog-user";
import { SearchForm } from "./search-form";

// Header of /home: reads the session (redirects without one).
export async function CatalogHeader() {
  const user = await requireCatalogUser();
  return (
    <AppHeader user={{ firstName: user.firstName, lastName: user.lastName }} />
  );
}

// Search field filled from the URL; focused when /me sent the user here.
export async function CatalogSearch({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { q, focusSearch } = parseCatalogParams(await searchParams);
  // Remount on a new query so the field shows the text from the URL
  return <SearchForm key={q} defaultValue={q} autoFocus={focusSearch} />;
}

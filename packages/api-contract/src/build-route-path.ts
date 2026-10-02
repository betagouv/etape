import type { RouteDefinition, RouteParams, RouteQuery } from "./route-definition";

interface BuildRoutePathOptions<T extends RouteDefinition> {
  params?: RouteParams<T>;
  query?: RouteQuery<T>;
}

export function buildRoutePath<T extends RouteDefinition>(
  route: T,
  options: BuildRoutePathOptions<T> = {},
): string {
  let path: string = route.path;

  const params = options.params as Record<string, string | number> | undefined;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  const query = options.query as Record<string, string | number | boolean | undefined> | undefined;

  if (query) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }

    const queryString = searchParams.toString();

    if (queryString) {
      path = `${path}?${queryString}`;
    }
  }

  return path;
}

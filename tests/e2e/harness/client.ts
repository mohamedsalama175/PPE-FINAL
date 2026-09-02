export interface HttpResponse<T = any> {
  status: number;
  data: T;
  json: T;
  text: string;
  headers: Headers;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export class TestClient {
  constructor(public baseUrl: string, public defaultToken?: string) {}

  async request<T = any>(
    method: string,
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path}`);
    if (options.params) {
      for (const [key, val] of Object.entries(options.params)) {
        if (val !== undefined) url.searchParams.set(key, String(val));
      }
    }

    const headers: Record<string, string> = {
      ...(options.headers || {}),
    };

    const token = options.token !== undefined ? options.token : this.defaultToken;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let payload: string | undefined = undefined;
    if (body !== undefined) {
      if (typeof body === "string") {
        payload = body;
      } else {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
        payload = JSON.stringify(body);
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: payload,
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = null;
    }

    return {
      status: res.status,
      data: json !== null ? json : text,
      json,
      text,
      headers: res.headers,
    };
  }

  get<T = any>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PUT", path, body, options);
  }

  patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }

  delete<T = any>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("DELETE", path, undefined, options);
  }
}

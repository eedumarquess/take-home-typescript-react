import { requestJson, setApiAccessToken, setUnauthorizedHandler } from './api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

describe('api service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setApiAccessToken(null);
    setUnauthorizedHandler(null);
  });

  it('retries the request after a successful token refresh', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'INVALID_TOKEN',
              message: 'Token mal formado ou invalido',
              details: [],
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: 'fresh-access-token',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: 'order-1' }],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);
    setApiAccessToken('stale-access-token');

    await expect(requestJson<{ data: Array<{ id: string }> }>('/orders')).resolves.toEqual({
      data: [{ id: 'order-1' }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
      credentials: 'include',
      headers: expect.any(Headers),
    });
    expect((fetchMock.mock.calls[2]?.[1]?.headers as Headers).get('Authorization')).toBe(
      'Bearer fresh-access-token',
    );
  });

  it('calls the unauthorized handler when refresh fails after a 401', async () => {
    const unauthorizedHandler = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'INVALID_TOKEN',
              message: 'Token mal formado ou invalido',
              details: [],
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'INVALID_REFRESH_TOKEN',
              message: 'Refresh token invalido ou expirado',
              details: [],
            },
          },
          401,
        ),
      );

    vi.stubGlobal('fetch', fetchMock);
    setApiAccessToken('stale-access-token');
    setUnauthorizedHandler(unauthorizedHandler);

    await expect(requestJson('/orders')).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
      status: 401,
    });
    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);
  });
});

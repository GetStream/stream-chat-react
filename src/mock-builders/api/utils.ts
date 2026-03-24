type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export interface MockedApiResponse {
  response: {
    data: unknown;
    status: number;
  };
  type: HttpMethod;
}

export const mockedApiResponse = (
  response: unknown,
  type: HttpMethod = 'get',
  status: number = 200,
): MockedApiResponse => ({
  response: {
    data: response,
    status,
  },
  type,
});

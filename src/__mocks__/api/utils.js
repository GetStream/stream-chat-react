export const mockedApiResponse = (response, type = 'get') => ({
  type,
  response: {
    data: response,
    status: 200,
  },
});

export async function retry<T>(
  func: () => Promise<T>,
  max_tries = 3
): Promise<T | undefined> {
  let tries = 0;
  while (tries < max_tries) {
    try {
      return await func();
    } catch (error) {
      console.log(error);
      tries++;
    }
  }
  return undefined;
}

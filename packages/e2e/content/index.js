export const load = async ({ data }) => {
  return { ...data, loadContent: "Hello, load action!" };
};

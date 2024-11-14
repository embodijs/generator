export const load = async ({data}) => {
    console.log(data);
    return { ...data, loadContent: 'Hello load action!' };
}
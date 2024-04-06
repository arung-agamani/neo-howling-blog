export function slugFromTitle(title: string) {
    return title
        .toLowerCase()
        .split("")
        .filter((char) => /[a-zA-Z -]/.test(char))
        .join("")
        .replaceAll(" ", "-");
}

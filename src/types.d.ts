// Declaración de módulos para permitir la importación en pestañas separadas
declare module '*.html' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: string;
  export default content;
}

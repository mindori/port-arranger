declare module 'detect-port' {
  function detectPort(port?: number): Promise<number>;
  export default detectPort;
}

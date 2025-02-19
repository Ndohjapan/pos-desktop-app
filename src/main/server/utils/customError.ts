class CustomError extends Error {
  msg: string;
  code: number;

  constructor(msg: string = "", code: number = 401) {
    super(msg);
    this.msg = msg;
    this.code = code;
  }
}

export default CustomError;

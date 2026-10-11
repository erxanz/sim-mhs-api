import { ApiError } from "../utils/api-error.js";

function toIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(ApiError.unprocessable("Validasi gagal", toIssues(result.error)));
    }
    req.valid = { ...(req.valid ?? {}), ...result.data };
    next();
  };
}

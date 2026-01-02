export class ApiError extends Error {
    constructor({ errorCode, title, status, detail, instance }) {
        super(detail || title || "Erro na API");
        this.name = "ApiError";
        this.errorCode = errorCode;
        this.status = status;
        this.title = title;
        this.detail = detail;
        this.instance = instance;
    }
}
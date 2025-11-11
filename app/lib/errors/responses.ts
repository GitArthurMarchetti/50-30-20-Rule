import { NextResponse } from "next/server";

/** Resposta de erro 400 - Requisição Inválida */
export function badRequestResponse(message: string = "Bad Request") {
    return NextResponse.json(
        { message },
        { status: 400 });
}

/** Resposta de erro 401 - Não Autorizado */
export function unauthorizedResponse(message: string = "Unauthorized") {
    return NextResponse.json(
        { message },
        { status: 401 });
}

/** Resposta de erro 403 - Proibido */
export function forbiddenResponse(message: string = "Forbidden") {
    return NextResponse.json(
        { message },
        { status: 403 }
    );
}

/** Resposta de erro 404 - Não Encontrado */
export function notFoundResponse(message: string = "Not Found") {
    return NextResponse.json(
        { message },
        { status: 404 }
    );
}

/** Resposta de erro 405 - Método Não Permitido */
export function methodNotAllowedResponse(message: string = "Method Not Allowed") {
    return NextResponse.json(
        { message },
        { status: 405 }
    );
}

/** Resposta de erro 409 - Conflito */
export function conflictResponse(message: string = "Conflict") {
    return NextResponse.json(
        { message },
        { status: 409 }
    );
}

/** Resposta de erro 422 - Entidade Não Processável (Erro de Validação) */
export function unprocessableEntityResponse(message: string = "Unprocessable Entity") {
    return NextResponse.json(
        { message },
        { status: 422 }
    );
}

/** Resposta de erro 500 - Erro Interno do Servidor */
export function internalErrorResponse(message: string = "Internal Server Error") {
    return NextResponse.json(
        { message },
        { status: 500 }
    );
}
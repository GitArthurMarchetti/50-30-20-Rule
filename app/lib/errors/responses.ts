import { NextResponse } from "next/server";

/** Error response 400 - Bad Request */
export function badRequestResponse(message: string = "Bad Request") {
    return NextResponse.json(
        { message },
        { status: 400 });
}

/** Error response 401 - Unauthorized */
export function unauthorizedResponse(message: string = "Unauthorized") {
    return NextResponse.json(
        { message },
        { status: 401 });
}

/** Error response 403 - Forbidden */
export function forbiddenResponse(message: string = "Forbidden") {
    return NextResponse.json(
        { message },
        { status: 403 }
    );
}

/** Error response 404 - Not Found */
export function notFoundResponse(message: string = "Not Found") {
    return NextResponse.json(
        { message },
        { status: 404 }
    );
}

/** Error response 405 - Method Not Allowed */
export function methodNotAllowedResponse(message: string = "Method Not Allowed") {
    return NextResponse.json(
        { message },
        { status: 405 }
    );
}

/** Error response 409 - Conflict */
export function conflictResponse(message: string = "Conflict") {
    return NextResponse.json(
        { message },
        { status: 409 }
    );
}

/** Error response 422 - Unprocessable Entity (Validation Error) */
export function unprocessableEntityResponse(message: string = "Unprocessable Entity") {
    return NextResponse.json(
        { message },
        { status: 422 }
    );
}

/** Error response 429 - Too Many Requests (Rate Limit) */
export function tooManyRequestsResponse(message: string = "Too Many Requests") {
    return NextResponse.json(
        { message },
        { status: 429 }
    );
}

/** Error response 500 - Internal Server Error */
export function internalErrorResponse(message: string = "Internal Server Error") {
    return NextResponse.json(
        { message },
        { status: 500 }
    );
}
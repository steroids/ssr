const getStatusCode = (context, preloadedErrors) => {
    // Ищем только критические ошибки
    const criticalErrors = Object.values(preloadedErrors).filter((e: any) => e.isCritical) as any;

    const firstStatus = criticalErrors.find((criticalError: any) => criticalError?.response?.status)?.response?.status;

    if (firstStatus) {
        return firstStatus;
    }

    return context.statusCode || 200;
};

export default getStatusCode;

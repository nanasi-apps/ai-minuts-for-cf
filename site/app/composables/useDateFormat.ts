export const useDateFormat = () => {
    const formatDate = (dateString: string | Date) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return {
        formatDate,
    };
};

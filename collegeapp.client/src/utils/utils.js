export const stdPaingationSize = 5;
export default class Services {
    formatString = (str, values) => { return str.replace(/%d/g, () => values.shift()); };
    refreshToken = () => localStorage.getItem("refresh_token");
    accessToken = () => localStorage.getItem("access_token");
    
    /* asp.net returns default error in little different which does not align with how our error compoenet work,
    errors can be
    {key: [list of problems]} or [ {key1: [list of problems] }, {key2: [list of problems]} ]   */
    normalizeError = (errorObject) => {
        const errorArray = [];
        for (let i in errorObject) {
            const currentObj = errorObject[i];

            if (Array.isArray(currentObj)) {
                for (let j in currentObj) {
                    errorArray.push({ value: currentObj[j] });
                }
            } else {
                console.log(typeof currentObj === "object")
                if (typeof currentObj === "object") {
                    for (let j in currentObj) {
                        errorArray.push({ value: currentObj[j] });
                    }
                } else {
                    errorArray.push({ value: currentObj });
                }
            }
        }
        return errorArray;
    }
    normalizeASPDate(dateString) {
        const date = new Date(dateString);
        const options =
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return date.toLocaleDateString(undefined, options);
    }
    substring(str, characters) {
        return str.length >= characters ? str.substring(0, characters) + "..." : str;
    }

    
}
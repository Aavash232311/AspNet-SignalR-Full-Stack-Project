const {fetch: fetchWithInterceptors} = window;

window.fetch = async (...args) => {
    let [resource, config] = args;

    const res = await fetchWithInterceptors(resource, config); // let the request proceed as usual
    if (res.status === 401) {
        // now what we can do is try and hit the refresh token endpoint to get new tokens, 
        // and check if that's possible
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken !== undefined) {
            try {
                const refreshResponse = await fetchWithInterceptors('/auth/refresh-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });

                console.log("Refresh response", refreshResponse);

                if (refreshResponse.ok) {
                    // let's retrieve the new access token!
                    const { value } = await refreshResponse.json();
                    localStorage.setItem("access_token", value);

                    const newConfig = {
                        ...config,
                        headers: {
                            ...config?.headers,
                            'Authorization': `Bearer ${value}`
                        }
                    };
                    
                    // return the result of the retried call, with new access token
                    return await fetchWithInterceptors(resource, newConfig);
                }
            } catch (err) {
                console.error("Refresh flow failed", err);
            }
        }
    }
    return res; // if not 401, just return the original response
}
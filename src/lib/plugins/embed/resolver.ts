export interface ResolverResult {
    provider_name: string
    html: string
    width: number
    height: number
}

export function resolver(providers: any[]) {
    return async (url: string): Promise<ResolverResult> => {
        const endpoint = getEndpoint(providers, url)

        if (endpoint) {
            const endpointUrl = new URL(endpoint.url.replace('{format}', 'json'))
            endpointUrl.searchParams.set('url', url)
            endpointUrl.searchParams.set('format', 'json')
            endpointUrl.searchParams.set('maxwidth', '640')
            endpointUrl.searchParams.set('maxheight', '480')

            const response = await fetch(endpointUrl)
            if (response.status === 200) {
                const result = await response.json()
                return endpoint.apply?.(result) ?? result
            }
            throw new Error(`Failed to resolve oembed url ${url}`)
        }
        throw new Error(`No oembed provider defined for url ${url}`)
    }
}

export function resolverWithProviders(providerNames?: string[]) {
    if (providerNames) {
        const tokens = providerNames.map((n) => n.toLowerCase())
        const providers = PROVIDERS.filter((p) => tokens.includes(p.provider_name.toLowerCase()))
        return resolver(providers)
    }
    return resolver(PROVIDERS)
}

function getEndpoint(providers: any[], url: string) {
    for (const provider of providers) {
        for (const endpoint of provider.endpoints) {
            for (const scheme of endpoint.schemes) {
                const schemeRegexp = new RegExp(scheme.replaceAll('*', '[^./]+'))
                if (schemeRegexp.exec(url)) return endpoint
            }
        }
    }
}

const PROVIDERS = [
    {
        provider_name: 'YouTube',
        provider_url: 'https://www.youtube.com/',
        endpoints: [
            {
                schemes: [
                    'https://*.youtube.com/watch*',
                    'https://*.youtube.com/v/*',
                    'https://youtu.be/*',
                    'https://*.youtube.com/playlist?list=*',
                    'https://youtube.com/playlist?list=*',
                    'https://*.youtube.com/shorts*'
                ],
                url: 'https://www.youtube.com/oembed',
                discovery: true
            }
        ]
    },
    {
        provider_name: 'Vimeo',
        provider_url: 'https://vimeo.com/',
        endpoints: [
            {
                schemes: [
                    'https://vimeo.com/*',
                    'https://vimeo.com/album/*/video/*',
                    'https://vimeo.com/channels/*/*',
                    'https://vimeo.com/groups/*/videos/*',
                    'https://vimeo.com/ondemand/*/*',
                    'https://player.vimeo.com/video/*'
                ],
                url: 'https://vimeo.com/api/oembed.{format}',
                discovery: true
            }
        ]
    },
    {
        provider_name: 'Twitter',
        provider_url: 'http://www.twitter.com/',
        endpoints: [
            {
                schemes: [
                    'https://twitter.com/*',
                    'https://twitter.com/*/status/*',
                    'https://*.twitter.com/*/status/*'
                ],
                url: 'https://publish.twitter.com/oembed'
            }
        ]
    },
    {
        provider_name: 'TikTok',
        provider_url: 'http://www.tiktok.com/',
        endpoints: [
            {
                schemes: ['https://www.tiktok.com/*', 'https://www.tiktok.com/*/video/*'],
                url: 'https://www.tiktok.com/oembed',
                apply: ((result: any) => ({...result, width: 335, height: 900}))
            }
        ],
    }
]

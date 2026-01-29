'use client'

interface GoogleMapsEmbedProps {
  mapsUrl: string
  businessName: string
}

export function GoogleMapsEmbed({ mapsUrl, businessName }: GoogleMapsEmbedProps) {
  const getEmbedUrl = (url: string): string => {
    try {
      // Se já for um link de embed correto (com pb=), usar direto
      if (url.includes('/embed?pb=')) {
        return url
      }
      
      // Se for link de embed mas sem parâmetros adequados, tentar melhorar
      if (url.includes('/embed')) {
        // Verificar se tem um marcador/place definido
        const urlObj = new URL(url)
        const pb = urlObj.searchParams.get('pb')
        
        // Se tiver pb (protocol buffer), está correto
        if (pb) {
          return url
        }
      }
      
      // Para links normais do Google Maps, tentar extrair informações
      const urlObj = new URL(url)
      
      // Extrair place_id, coordenadas ou query
      const placeId = urlObj.searchParams.get('place_id')
      const q = urlObj.searchParams.get('q')
      
      // Tentar extrair coordenadas do caminho (@lat,lng)
      const pathMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      
      if (placeId) {
        // Usar place_id para garantir marcador
        return `https://www.google.com/maps/embed/v1/place?key=&q=place_id:${placeId}`
      }
      
      if (pathMatch && pathMatch[1] && pathMatch[2]) {
        // Usar coordenadas para garantir marcador
        const lat = pathMatch[1]
        const lng = pathMatch[2]
        return `https://www.google.com/maps/embed?q=${lat},${lng}&output=embed`
      }
      
      if (q) {
        // Usar query para buscar local com marcador
        return `https://www.google.com/maps/embed?q=${encodeURIComponent(q)}&output=embed`
      }
      
      // Fallback: usar o link original
      return url
    } catch (error) {
      console.error('Erro ao processar URL do Google Maps:', error)
      return url
    }
  }

  const embedUrl = getEmbedUrl(mapsUrl)

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Localização de ${businessName}`}
        className="w-full h-full"
      />
    </div>
  )
}

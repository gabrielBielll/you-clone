import type { IYoutubeRepository } from '../domain/ports/IYoutubeRepository';
import { GoogleYoutubeAdapter } from '../adapters/outbound/GoogleYoutubeAdapter';

/**
 * CONTAINER DE INJEÇÃO DE DEPENDÊNCIA (DI)
 * Onde "NÓS" decidimos qual implementação a fábrica entrega pro sistema.
 * Se fosse pra usar outro Backend/API, bastaria trocar a linha abaixo para `new VimeoAdapter()`.
 */
export const container = {
  get youtubeRepository(): IYoutubeRepository {
    // Retornamos a classe adaptadora original instanciada com seu contrato interfaceado
    return new GoogleYoutubeAdapter();
  }
};

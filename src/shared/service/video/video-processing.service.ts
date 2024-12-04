import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';

@Injectable({
  providedIn: 'root'
})
export class VideoProcessingService {
  private ffmpeg: FFmpeg;
  private isFFmpegLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  // Função para carregar o FFmpeg
  private async loadFFmpeg(): Promise<void> {
    if (!this.isFFmpegLoaded) {
      try {
        console.log('Carregando FFmpeg...');
        await this.ffmpeg.load();
        this.isFFmpegLoaded = true;
        console.log('FFmpeg carregado com sucesso');
      } catch (error) {
        console.error('Erro ao carregar FFmpeg:', error);
        throw new Error('Erro ao carregar FFmpeg');
      }
    }
  }

  // Função para cortar o vídeo
  async cutVideo(videoBlob: Blob, start: string, end: string): Promise<Blob> {
    await this.loadFFmpeg();

    try {
      console.log('Processando vídeo...');

      // Converte o Blob para ArrayBuffer
      const videoArrayBuffer = await videoBlob.arrayBuffer();
      console.log('Vídeo carregado na memória');

      // Escreve o vídeo na memória virtual do FFmpeg
      await this.ffmpeg.writeFile('input.mp4', new Uint8Array(videoArrayBuffer));

      // Executa o comando para cortar o vídeo
      console.log(`Cortando vídeo de ${start} a ${end}`);
      await this.ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', start,        // Ponto de início
        '-to', end,          // Ponto de fim
        '-c', 'copy',        // Copiar streams sem reencodificar
        'output.mp4'
      ]);

      // Lê o vídeo processado
      const outputData = await this.ffmpeg.readFile('output.mp4');
      console.log('Vídeo cortado com sucesso');

      // Deleta os arquivos temporários
      await this.ffmpeg.deleteFile('input.mp4');
      await this.ffmpeg.deleteFile('output.mp4');

      // Retorna o vídeo cortado como Blob
      return new Blob([outputData], { type: 'video/mp4' });
    } catch (error) {
      console.error('Erro ao processar o vídeo:', error);
      throw new Error('Erro ao processar o vídeo');
    }
  }

  async processVideo(videoBlob: Blob, start: string, end: string): Promise<Blob> {
    console.log('Processing video:', videoBlob, start, end);

    // Caminho para o worker
    const workerScriptPath = '/assets/worker.js';

    // Criando o Worker como um módulo
    const worker = new Worker(workerScriptPath, { type: 'module' });

    return new Promise<Blob>((resolve, reject) => {
      worker.onmessage = (event) => {
        const processedBlob = event.data; // Obtém a resposta do Worker
        resolve(processedBlob);
        worker.terminate(); // Termina o Worker após a resposta
      };

      onerror = function (e) {
        console.error('Worker error:', e);
        postMessage({ error: 'Erro no processamento do vídeo', details: e });
      };

      // Envia a tarefa para o Worker com os parâmetros
      worker.postMessage({ videoBlob, start, end });
    });
  }


}



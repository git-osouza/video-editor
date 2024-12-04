import { createFFmpeg } from '@ffmpeg/ffmpeg';

// Carrega o FFmpeg
const ffmpeg = createFFmpeg({ log: true });

async function processVideo(videoBlob, start, end) {
  // Baixa o FFmpeg (apenas uma vez)
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  // Cria um arquivo temporário a partir do Blob de vídeo
  const videoFileName = 'input.mp4';
  const outputFileName = 'output.mp4';

  // Carrega o vídeo para o FFmpeg
  ffmpeg.FS('writeFile', videoFileName, new Uint8Array(await videoBlob.arrayBuffer()));

  // Executa o corte do vídeo com os parâmetros fornecidos
  await ffmpeg.run('-i', videoFileName, '-ss', start, '-to', end, '-c', 'copy', outputFileName);

  // Obtém o arquivo de vídeo cortado
  const outputData = ffmpeg.FS('readFile', outputFileName);

  // Cria um Blob com o arquivo cortado
  const processedBlob = new Blob([outputData.buffer], { type: 'video/mp4' });

  // Envia o vídeo processado de volta para o thread principal
  postMessage(processedBlob);
}

// Recebe os dados do thread principal
onmessage = async function (event) {
  try {
    const { videoBlob, start, end } = event.data;
    console.log('Iniciando o processamento do vídeo...');

    // Adicione mais logs aqui para acompanhar o progresso
    console.log('Iniciando corte do vídeo...', start, end);

    const processedBlob = await processVideo(videoBlob, start, end);
    console.log('Vídeo processado com sucesso!');

    // Envia a resposta de volta para o main thread
    postMessage({ success: true, processedBlob });
  } catch (err) {
    console.error('Erro ao processar o vídeo:', err);
    postMessage({ success: false, error: err.message });
  }
};

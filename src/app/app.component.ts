import { ChangeDetectorRef, Component } from '@angular/core';
import { VideoProcessingService } from 'src/shared/service/video/video-processing.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  videoFile: File | null = null;
  cutSegments: { start: string; end: string }[] = [];
  outputVideos: Blob[] = [];
  isProcessing: boolean = false;
  displayedColumns: string[] = ['start', 'end'];

  constructor(private videoProcessingService: VideoProcessingService, private cdr: ChangeDetectorRef) { }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.videoFile = file;
      console.log('Arquivo selecionado:', file);
    }
  }


  addSegment(start: string, end: string) {
    this.cutSegments.push({ start, end });
    this.cdr.markForCheck();
    console.log(this.cutSegments);
  }

  async processSegments() {
    if (this.videoFile) {
      this.isProcessing = true;
      for (const segment of this.cutSegments) {
        const processedVideo = await this.videoProcessingService.cutVideo(
          this.videoFile,
          segment.start,
          segment.end
        );
        this.outputVideos.push(processedVideo);
      }
      this.isProcessing = false;
    }
  }


  downloadProcessedVideo(index: number): void {
    const videoBlob = this.outputVideos[index];
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_video_${index + 1}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

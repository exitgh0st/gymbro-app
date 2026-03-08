import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    let html = this.escapeHtml(value);

    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* (but not inside bold)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Inline code: `text`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers: ### text (at start of line)
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Unordered lists: - item or * item
    html = html.replace(/^(?:- |\* )(.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Numbered lists: 1. item
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive <li> not already in <ul> into <ol>
    html = html.replace(/(?<!<\/ul>)((?:<li>.*<\/li>\n?)+)/g, (match) => {
      // Only wrap if not already inside a <ul>
      return `<ol>${match}</ol>`;
    });

    // Line breaks: convert newlines to <br> (but not inside list/header tags)
    html = html.replace(/\n/g, '<br>');

    // Clean up <br> after block elements
    html = html.replace(/(<\/(?:h[2-4]|ul|ol|li)>)<br>/g, '$1');
    html = html.replace(/<br>(<(?:h[2-4]|ul|ol|li)>)/g, '$1');
    html = html.replace(/<br>(<\/(?:h[2-4]|ul|ol|li)>)/g, '$1');

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

import { Tooltip } from 'antd';
import React from 'react';

interface TableEllipsisTextProps {
  /** 展示文本；空则显示 emptyText */
  text?: string | null;
  emptyText?: string;
}

/**
 * 表格单元格：单行省略号，悬停或点击（移动端）查看全文
 */
export const TableEllipsisText: React.FC<TableEllipsisTextProps> = ({ text, emptyText = '-' }) => {
  const s =
    text === null || text === undefined || String(text).trim() === '' ? emptyText : String(text);
  const showTip = s !== emptyText;

  return (
    <Tooltip
      title={showTip ? <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{s}</span> : undefined}
      placement="topLeft"
      trigger={['hover', 'click']}
      overlayInnerStyle={{ maxWidth: 420 }}
    >
      <span
        style={{
          display: 'block',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {s}
      </span>
    </Tooltip>
  );
};

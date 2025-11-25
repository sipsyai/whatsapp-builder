import type { Node, Edge } from '@xyflow/react';
import type { ButtonItem, SectionItem } from '../../../shared/types';

export interface ValidationError {
  nodeId: string;
  message: string;
  severity: 'error' | 'warning';
}

export const validateFlow = (
  nodes: Node[],
  edges: Edge[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // 1. START node check
  const startNodes = nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      nodeId: 'flow',
      message: 'Flow must start with a START node',
      severity: 'error'
    });
  }
  if (startNodes.length > 1) {
    errors.push({
      nodeId: 'flow',
      message: 'Flow can only have one START node',
      severity: 'error'
    });
  }

  // 2. Check each node's outgoing edges
  nodes.forEach(node => {
    const outgoingEdges = edges.filter(e => e.source === node.id);

    if (node.type === 'condition') {
      // Condition node must have 2 edges (true/false)
      const trueEdge = outgoingEdges.find(e => e.sourceHandle === 'true');
      const falseEdge = outgoingEdges.find(e => e.sourceHandle === 'false');

      if (!trueEdge) {
        errors.push({
          nodeId: node.id,
          message: 'Condition node must have a "true" output',
          severity: 'error'
        });
      }
      if (!falseEdge) {
        errors.push({
          nodeId: node.id,
          message: 'Condition node must have a "false" output',
          severity: 'error'
        });
      }
    } else if (node.type === 'question' && node.data.questionType === 'buttons') {
      // Button question should have edges for all buttons
      const buttons = (node.data.buttons || []) as ButtonItem[];
      buttons.forEach((button: ButtonItem) => {
        const buttonEdge = outgoingEdges.find(e => e.sourceHandle === button.id);
        if (!buttonEdge) {
          errors.push({
            nodeId: node.id,
            message: `No edge defined for button "${button.title}"`,
            severity: 'warning'
          });
        }
      });
    }
  });

  // 3. Orphan node check (nodes without incoming connections)
  nodes.forEach(node => {
    if (node.type === 'start') return;

    const hasIncoming = edges.some(e => e.target === node.id);
    if (!hasIncoming) {
      errors.push({
        nodeId: node.id,
        message: 'This node is not connected to any other node',
        severity: 'warning'
      });
    }
  });

  // 4. Variable name check (for Question nodes)
  nodes.forEach(node => {
    if (node.type === 'question') {
      const variable = node.data.variable as string | undefined;
      if (!variable || variable.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: 'Question node must have a variable name',
          severity: 'error'
        });
      }
    }
  });

  // 5. Button/List content validation
  nodes.forEach(node => {
    if (node.type === 'question') {
      if (node.data.questionType === 'buttons') {
        const buttons = (node.data.buttons || []) as ButtonItem[];
        if (buttons.length === 0) {
          errors.push({
            nodeId: node.id,
            message: 'At least one button must be defined',
            severity: 'error'
          });
        }
        if (buttons.length > 3) {
          errors.push({
            nodeId: node.id,
            message: 'Maximum 3 buttons can be defined',
            severity: 'error'
          });
        }
        buttons.forEach((btn: ButtonItem, i: number) => {
          if (!btn.title || btn.title.trim() === '') {
            errors.push({
              nodeId: node.id,
              message: `Button ${i + 1} cannot be empty`,
              severity: 'error'
            });
          }
          if (btn.title && btn.title.length > 20) {
            errors.push({
              nodeId: node.id,
              message: `Button ${i + 1} can have maximum 20 characters`,
              severity: 'error'
            });
          }
        });
      }

      if (node.data.questionType === 'list') {
        const sections = (node.data.listSections || []) as SectionItem[];
        if (sections.length === 0) {
          errors.push({
            nodeId: node.id,
            message: 'At least one section must be defined',
            severity: 'error'
          });
        }
        if (sections.length > 10) {
          errors.push({
            nodeId: node.id,
            message: 'Maximum 10 sections can be defined',
            severity: 'error'
          });
        }

        // Validate each section
        sections.forEach((section: SectionItem, sectionIndex: number) => {
          if (!section.title || section.title.trim() === '') {
            errors.push({
              nodeId: node.id,
              message: `Section ${sectionIndex + 1} must have a title`,
              severity: 'error'
            });
          }
          if (section.title && section.title.length > 24) {
            errors.push({
              nodeId: node.id,
              message: `Section ${sectionIndex + 1} title can have maximum 24 characters`,
              severity: 'error'
            });
          }

          const rows = section.rows || [];
          if (rows.length === 0) {
            errors.push({
              nodeId: node.id,
              message: `Section ${sectionIndex + 1} must have at least one row`,
              severity: 'error'
            });
          }
          if (rows.length > 10) {
            errors.push({
              nodeId: node.id,
              message: `Section ${sectionIndex + 1} can have maximum 10 rows`,
              severity: 'error'
            });
          }

          // Validate each row
          rows.forEach((row, rowIndex) => {
            if (!row.title || row.title.trim() === '') {
              errors.push({
                nodeId: node.id,
                message: `Section ${sectionIndex + 1}, Row ${rowIndex + 1} must have a title`,
                severity: 'error'
              });
            }
            if (row.title && row.title.length > 24) {
              errors.push({
                nodeId: node.id,
                message: `Section ${sectionIndex + 1}, Row ${rowIndex + 1} title can have maximum 24 characters`,
                severity: 'error'
              });
            }
            if (row.description && row.description.length > 72) {
              errors.push({
                nodeId: node.id,
                message: `Section ${sectionIndex + 1}, Row ${rowIndex + 1} description can have maximum 72 characters`,
                severity: 'error'
              });
            }
          });
        });
      }
    }
  });

  // 6. Message content validation
  nodes.forEach(node => {
    if (node.type === 'message') {
      const content = node.data.content as string | undefined;
      if (!content || content.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: 'Message node must have content',
          severity: 'error'
        });
      }
    }
  });

  // 7. Condition validation
  nodes.forEach(node => {
    if (node.type === 'condition') {
      const conditionVar = node.data.conditionVar as string | undefined;
      const conditionOp = node.data.conditionOp as string | undefined;
      const conditionVal = node.data.conditionVal as string | undefined;

      if (!conditionVar || conditionVar.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: 'Condition node must have a variable to check',
          severity: 'error'
        });
      }
      if (!conditionOp) {
        errors.push({
          nodeId: node.id,
          message: 'Condition node must have an operator',
          severity: 'error'
        });
      }
      if (conditionVal === undefined || conditionVal === null || conditionVal === '') {
        errors.push({
          nodeId: node.id,
          message: 'Condition node must have a value to compare',
          severity: 'warning'
        });
      }
    }
  });

  // 8. WhatsApp Flow node validation
  nodes.forEach(node => {
    if (node.type === 'whatsapp_flow') {
      const whatsappFlowId = node.data.whatsappFlowId as string | undefined;
      const flowCta = node.data.flowCta as string | undefined;
      const flowBodyText = node.data.flowBodyText as string | undefined;

      if (!whatsappFlowId || whatsappFlowId.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: 'WhatsApp Flow node must have a flow selected',
          severity: 'error'
        });
      }

      if (!flowCta || flowCta.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: 'WhatsApp Flow node must have a button text (CTA)',
          severity: 'error'
        });
      }

      if (flowCta && flowCta.length > 20) {
        errors.push({
          nodeId: node.id,
          message: 'Button text (CTA) can have maximum 20 characters',
          severity: 'error'
        });
      }

      if (!flowBodyText || flowBodyText.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: 'WhatsApp Flow node must have body text',
          severity: 'error'
        });
      }

      if (flowBodyText && flowBodyText.length > 1024) {
        errors.push({
          nodeId: node.id,
          message: 'Body text can have maximum 1024 characters',
          severity: 'error'
        });
      }

      // Check if node has outgoing connection
      const outgoingEdges = edges.filter(e => e.source === node.id);
      if (outgoingEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          message: 'WhatsApp Flow node should have an outgoing connection for flow completion',
          severity: 'warning'
        });
      }
    }
  });

  return errors;
};

import React from 'react';
import { FlexWidget, TextWidget, SvgWidget } from 'react-native-android-widget';
import type { LumenWidgetData, LumenWidgetTask } from './widgetSync';

interface Props {
  data: LumenWidgetData;
}

export function MyDayWidget({ data }: Props) {
  const tasksList: LumenWidgetTask[] = Array.isArray(data.myDayTasks) ? data.myDayTasks : [];
  const completed = tasksList.filter((t) => t.isCompleted).length;
  const total = tasksList.length;
  const openCount = Math.max(0, total - completed);

  // Header status text
  let summaryText = 'Today';
  if (total > 0) {
    summaryText = openCount === 0 ? 'All done ✓' : `${openCount} left`;
  }

  // Display top 3 tasks to fit comfortably in 4x2 without clipping
  const visibleTasks = tasksList.slice(0, 3);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#2C2C2E',
        borderRadius: 26,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="Lumen My Day Widget"
    >
      {/* Header Row */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        {/* Left: Icon + "My Day" Title + Status */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
          clickAction="OPEN_APP"
          accessibilityLabel="Open My Day"
        >
          {/* Sun / Day Badge Icon */}
          <FlexWidget
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              backgroundColor: '#0A84FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <SvgWidget
              style={{ width: 14, height: 14 }}
              svg={`
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              `}
            />
          </FlexWidget>

          <TextWidget
            text="My Day"
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginRight: 8,
            }}
          />

          <TextWidget
            text={`·  ${summaryText}`}
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: '#8E8E93',
            }}
          />
        </FlexWidget>

        {/* Right: Interactive "+ Add" Pill */}
        <FlexWidget
          style={{
            backgroundColor: '#3A3A3C',
            borderRadius: 12,
            paddingHorizontal: 9,
            paddingVertical: 3.5,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          clickAction="OPEN_APP"
          accessibilityLabel="Add new task"
        >
          <TextWidget
            text="+ Add"
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: '#0A84FF',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Task List / Empty State */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flex: 1,
          flexDirection: 'column',
          justifyContent: visibleTasks.length > 0 ? 'flex-start' : 'center',
        }}
      >
        {visibleTasks.length > 0 ? (
          visibleTasks.map((task, index) => (
            <FlexWidget
              key={task.id || `task-${index}`}
              style={{
                width: 'match_parent',
                backgroundColor: '#1C1C1E',
                borderRadius: 12,
                paddingVertical: 7,
                paddingHorizontal: 10,
                marginBottom: index < visibleTasks.length - 1 ? 5 : 0,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {/* Checkbox Tap Circle */}
              <FlexWidget
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: task.isCompleted ? '#30D158' : '#00000000',
                  borderWidth: task.isCompleted ? 0 : 2,
                  borderColor: '#636366',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 9,
                }}
                clickAction="TOGGLE_TASK"
                clickActionData={{ taskId: task.id }}
                accessibilityLabel={`Toggle ${task.title}, currently ${task.isCompleted ? 'completed' : 'open'}`}
              >
                {task.isCompleted ? (
                  <SvgWidget
                    style={{ width: 11, height: 11 }}
                    svg={`
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    `}
                  />
                ) : null}
              </FlexWidget>

              {/* Task Title + Optional Important Star */}
              <FlexWidget
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                clickAction="OPEN_APP"
                accessibilityLabel={`Task: ${task.title}`}
              >
                <TextWidget
                  text={task.title}
                  style={{
                    fontSize: 12,
                    fontWeight: task.isCompleted ? 'normal' : '500',
                    color: task.isCompleted ? '#8E8E93' : '#FFFFFF',
                  }}
                  maxLines={1}
                />

                {task.isImportant ? (
                  <SvgWidget
                    style={{ width: 12, height: 12, marginLeft: 6 }}
                    svg={`
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD60A" stroke="#FFD60A" stroke-width="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    `}
                  />
                ) : null}
              </FlexWidget>
            </FlexWidget>
          ))
        ) : (
          /* Empty State */
          <FlexWidget
            style={{
              width: 'match_parent',
              height: 'match_parent',
              backgroundColor: '#1C1C1E',
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 12,
            }}
            clickAction="OPEN_APP"
            accessibilityLabel="All caught up for today. Tap to add a task."
          >
            <FlexWidget
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#30D15826',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <SvgWidget
                style={{ width: 14, height: 14 }}
                svg={`
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#30D158" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                `}
              />
            </FlexWidget>
            <TextWidget
              text="All caught up for today"
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#FFFFFF',
                marginBottom: 2,
              }}
            />
            <TextWidget
              text="Tap + Add to plan your day"
              style={{
                fontSize: 10.5,
                color: '#8E8E93',
              }}
            />
          </FlexWidget>
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

const fs = require('fs');
let lines = fs.readFileSync('src/app/components/customer-dashboard/customer-dashboard.component.ts', 'utf8').split(/\r?\n/);
lines.splice(587, 15,
  '                  <div class=\"input-field\">',
  '                    <label>Preferred Start Date</label>',
  '                    <div class=\"input-orb\" [class.invalid]=\"sDate.invalid && sDate.touched\">',
  '                      <input type=\"date\" [(ngModel)]=\"applyForm.startDate\" name=\"startDate\" required [min]=\"minStartDate\" [max]=\"maxStartDate\" #sDate=\"ngModel\">',
  '                    </div>',
  '                    @if (sDate.invalid && sDate.touched) {',
  '                      <span class=\"error-msg\">* Pick a date within 1 month from today</span>',
  '                    }',
  '                  </div>',
  '                </div>'
);
fs.writeFileSync('src/app/components/customer-dashboard/customer-dashboard.component.ts', lines.join('\n'));

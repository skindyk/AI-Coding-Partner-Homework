const csv = require('csv-parse');
const { parseString } = require('xml2js');
const Ticket = require('./models/Ticket');

class FileImporter {
  static async importCSV(fileContent) {
    return new Promise((resolve, reject) => {
      const records = [];
      let lineCount = 0;

      csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      })
        .on('data', (data) => {
          records.push(data);
        })
        .on('error', (err) => {
          reject({ status: 400, message: 'Invalid CSV format', details: [err.message] });
        })
        .on('end', () => {
          try {
            const output = records.map(row => {
              const ticketData = {};
              Object.keys(row).forEach(key => {
                if (key === 'tags') {
                  ticketData[key] = row[key] ? row[key].split(';').map(t => t.trim()) : [];
                } else if (key === 'metadata') {
                  try {
                    ticketData[key] = row[key] ? JSON.parse(row[key]) : {};
                  } catch (e) {
                    ticketData[key] = {};
                  }
                } else {
                  ticketData[key] = row[key];
                }
              });

              try {
                const ticket = new Ticket(ticketData);
                const validation = ticket.validate();
                
                if (validation.isValid) {
                  return { success: true, ticket };
                } else {
                  return { success: false, errors: validation.errors };
                }
              } catch (e) {
                return { success: false, errors: [e.message] };
              }
            });

            resolve(output);
          } catch (err) {
            reject({ status: 400, message: 'Error processing CSV records', details: [err.message] });
          }
        });
    });
  }

  static async importJSON(fileContent) {
    try {
      const data = JSON.parse(fileContent);
      const records = Array.isArray(data) ? data : [data];
      
      const output = records.map(ticketData => {
        try {
          const ticket = new Ticket(ticketData);
          const validation = ticket.validate();
          
          if (validation.isValid) {
            return { success: true, ticket };
          } else {
            return { success: false, errors: validation.errors };
          }
        } catch (e) {
          return { success: false, errors: [e.message] };
        }
      });

      return output;
    } catch (err) {
      throw {
        status: 400,
        message: 'Invalid JSON format',
        details: [err.message]
      };
    }
  }

  static async importXML(fileContent) {
    return new Promise((resolve, reject) => {
      parseString(fileContent, (err, result) => {
        if (err) {
          return reject({
            status: 400,
            message: 'Invalid XML format',
            details: [err.message]
          });
        }

        try {
          const tickets = result.tickets?.ticket || [];
          const ticketList = Array.isArray(tickets) ? tickets : [tickets];

          const output = ticketList.map(xmlTicket => {
            const ticketData = {};
            
            Object.keys(xmlTicket).forEach(key => {
              const value = xmlTicket[key];
              
              if (key === 'tags') {
                ticketData[key] = Array.isArray(value) ? value : [value];
              } else if (key === 'metadata' && value && typeof value === 'object') {
                ticketData[key] = value;
              } else if (Array.isArray(value) && value.length > 0) {
                ticketData[key] = value[0];
              } else {
                ticketData[key] = value;
              }
            });

            try {
              const ticket = new Ticket(ticketData);
              const validation = ticket.validate();
              
              if (validation.isValid) {
                return { success: true, ticket };
              } else {
                return { success: false, errors: validation.errors };
              }
            } catch (e) {
              return { success: false, errors: [e.message] };
            }
          });

          resolve(output);
        } catch (err) {
          reject({
            status: 400,
            message: 'Error processing XML records',
            details: [err.message]
          });
        }
      });
    });
  }

  static async import(fileContent, fileType) {
    const type = fileType.toLowerCase();

    if (type === 'csv') {
      return this.importCSV(fileContent);
    } else if (type === 'json') {
      return this.importJSON(fileContent);
    } else if (type === 'xml') {
      return this.importXML(fileContent);
    } else {
      throw {
        status: 400,
        message: 'Unsupported file type',
        details: [`Supported types: csv, json, xml. Received: ${type}`]
      };
    }
  }
}

module.exports = FileImporter;

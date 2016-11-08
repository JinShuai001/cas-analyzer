// Generated by CoffeeScript 1.8.0

/*
cas-analyser.coffee

Copyright (c) 2015 Jeongbin Park

GNU General Public License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var empty_cache, joins_length, parse_file, parse_joined, pri_back_patterns, pri_for_patterns, pri_len, process_chunk, revcompstr, run_cas_analyser, s_seq, seq_count, seq_range, set_primer_patterns,
  __modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

pri_len = 15;

s_seq = '';

seq_range = '';

joins_length = 0;

seq_count = {};

pri_for_patterns = [];

pri_back_patterns = [];

set_primer_patterns = function(_pri_for_patterns, _pri_back_patterns) {
  pri_for_patterns = _pri_for_patterns;
  return pri_back_patterns = _pri_back_patterns;
};

empty_cache = function() {
  joins_length = 0;
  seq_count = {};
};

process_chunk = function(seqs) {
  var cut_seq, end_pos, flag_back, flag_for, m, pattern, seq, start_pos, _i, _j, _k, _len, _len1, _len2;
  for (_i = 0, _len = seqs.length; _i < _len; _i++) {
    seq = seqs[_i];
    flag_for = 0;
    flag_back = 0;
    for (_j = 0, _len1 = pri_for_patterns.length; _j < _len1; _j++) {
      pattern = pri_for_patterns[_j];
      pattern = new RegExp(pattern);
      m = pattern.exec(seq);
      if (m) {
        start_pos = m.index;
        flag_for = 1;
      }
    }
    for (_k = 0, _len2 = pri_back_patterns.length; _k < _len2; _k++) {
      pattern = pri_back_patterns[_k];
      pattern = new RegExp(pattern);
      m = pattern.exec(seq);
      if (m) {
        end_pos = m.index;
        flag_back = 1;
      }
    }
    if (flag_for && flag_back) {
      cut_seq = seq.slice(start_pos, end_pos + pri_len);
      if (cut_seq in seq_count) {
        seq_count[cut_seq] += 1;
      } else {
        seq_count[cut_seq] = 1;
      }
    }
    joins_length += 1;
  }
};

parse_file = function(file, pgcallback, chunkcallback) {
  var bufsize, f, gzipped, line, linecnt, seq_list;
  seq_list = [];
  bufsize = 10000;
  gzipped = 0;
  if (file.name.split('.').pop() === 'gz') {
    gzipped = 1;
  }
  f = new jbfilereadersync(file, gzipped);
  linecnt = 0;
  line = f.readline();
  while (line.length > 0) {
    if (__modulo(linecnt, 4) === 1) {
      seq_list.push(line);
      if (seq_list.length === bufsize) {
        chunkcallback(seq_list);
        seq_list = [];
      }
    }
    if (__modulo(linecnt, 1000) === 0) {
      pgcallback(f.fpos * 100 / f.filesize);
    }
    line = f.readline();
    linecnt += 1;
  }
  if (seq_list.length > 0) {
    chunkcallback(seq_list);
    pgcallback(f.fpos * 100 / f.filesize);
  }
};

revcompstr = function(s) {
  var i, l, _i, _ref;
  l = s.split('').reverse();
  for (i = _i = 0, _ref = l.length; _i < _ref; i = _i += 1) {
    if (l[i] === 'A') {
      l[i] = 'T';
    } else if (l[i] === 'T') {
      l[i] = 'A';
    } else if (l[i] === 'G') {
      l[i] = 'C';
    } else if (l[i] === 'C') {
      l[i] = 'G';
    } else if (l[i] === 'a') {
      l[i] = 't';
    } else if (l[i] === 't') {
      l[i] = 'a';
    } else if (l[i] === 'g') {
      l[i] = 'c';
    } else if (l[i] === 'c') {
      l[i] = 'g';
    }
  }
  return l.join('');
};

run_cas_analyser = function(seq_range, seq_hdr, filt_n, filt_r, pgcallback) {
  var cnt_del, cnt_hdr, cnt_ins, compare, count_seqs, cpos, data, dscnt, entry, gap, i, iscnt, item_cnt, j, length_range, m, mut_results, n, p, query_cnt, re_gap, seq, tot_count, tot_results, totlr_count, _i, _j, _k, _l, _m, _n, _o, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
  tot_results = [];
  mut_results = [];
  count_seqs = [];
  totlr_count = 0;
  tot_count = 0;
  length_range = seq_range.length;
  n = Math.floor(Object.keys(seq_count).length / 20);
  i = 0;
  for (seq in seq_count) {
    if (!seq_count.hasOwnProperty(seq)) {
      continue;
    }
    item_cnt = seq_count[seq];
    totlr_count += item_cnt;
    if (item_cnt > filt_n) {
      count_seqs.push({
        "seq": seq,
        "count": item_cnt
      });
      tot_count += item_cnt;
    }
    if (i % n === 0) {
      pgcallback(i / Object.keys(seq_count).length * 50);
    }
    i += 1;
  }
  pgcallback(50);
  query_cnt = 0;
  compare = function(a, b) {
    if (a.count < b.count) {
      return 1;
    }
    if (a.count > b.count) {
      return -1;
    }
    return 0;
  };
  count_seqs.sort(compare);
  data = {
    table: [],
    il: [],
    dl: [],
    is: [],
    ds: [],
    hdr: 0
  };
  cnt_hdr = 0;
  cnt_ins = 0;
  cnt_del = 0;
  dscnt = 1;
  iscnt = 1;
  re_gap = /-+/g;
  for (i = _i = 0, _ref = seq_range.length; _i <= _ref; i = _i += 1) {
    data.il.push([i, 0]);
    data.dl.push([i, 0]);
  }
  n = Math.floor(count_seqs.length / 20);
  for (i = _j = 0, _ref1 = count_seqs.length; _j < _ref1; i = _j += 1) {
    entry = [];
    p = needle(seq_range, count_seqs[i].seq, 10, 0.5, 10, 0.5);
    entry[0] = i + 1;
    entry[1] = p[0];
    entry[2] = p[2];
    entry[3] = p[1];
    entry[4] = count_seqs[i].seq.length;
    entry[5] = count_seqs[i].count;
    if (seq_range.length === entry[4]) {
      entry[6] = 0;
    } else {
      if (filt_r > 0 && s_seq !== '' && count_seqs[i].seq.indexOf(s_seq) > 0) {
        entry[6] = 0;
      } else {
        if (entry[4] > seq_range.length) {
          entry[6] = 1;
          cnt_ins += entry[5];
        } else {
          entry[6] = 2;
          cnt_del += entry[5];
        }
      }
    }
    if (seq_hdr === '') {
      entry[7] = -2;
    } else {
      entry[7] = count_seqs[i].seq.indexOf(seq_hdr);
      if (entry[7] > 0) {
        cnt_hdr += entry[5];
      }
    }
    data.table.push(entry);
    cpos = 0;
    if (entry[6] === 1) {
      while (true) {
        m = re_gap.exec(entry[1]);
        if (m) {
          gap = m[0];
          if (data.is.length < gap.length) {
            for (j = _k = 0, _ref2 = gap.length - data.is.length; _k <= _ref2; j = _k += 1) {
              data.is.push([iscnt++, 0]);
            }
          }
          data.is[gap.length - 1][1] += count_seqs[i].count;
        } else {
          break;
        }
      }
      for (j = _l = 0, _ref3 = entry[1].length - 1; _l <= _ref3; j = _l += 1) {
        if (entry[1][j] !== '-') {
          cpos += 1;
          if (cpos >= seq_range.length) {
            break;
          }
          if (entry[1][j + 1] === '-') {
            data.il[cpos][1] += count_seqs[i].count;
          }
        }
      }
    } else if (entry[6] === 2) {
      while (true) {
        m = re_gap.exec(entry[2]);
        if (m) {
          gap = m[0];
          if (data.ds.length < gap.length) {
            for (j = _m = 0, _ref4 = gap.length - data.ds.length; _m <= _ref4; j = _m += 1) {
              data.ds.push([dscnt++, 0]);
            }
          }
          data.ds[gap.length - 1][1] += count_seqs[i].count;
        } else {
          break;
        }
      }
      for (j = _n = 0, _ref5 = entry[1].length; _n <= _ref5; j = _n += 1) {
        if (entry[2][j] === '-') {
          data.dl[cpos][1] += count_seqs[i].count;
        }
        if (entry[1][j] !== '-') {
          cpos += 1;
        }
      }
    }
    if (i % n === 0) {
      pgcallback(50 + 50 * i / (count_seqs.length - 1));
    }
  }
  for (i = _o = 0, _ref6 = seq_range.length; _o <= _ref6; i = _o += 1) {
    data.il[i][1] /= tot_count;
    data.dl[i][1] /= tot_count;
    data.il[i][1] *= 100;
    data.dl[i][1] *= 100;
  }
  data.hdr = cnt_hdr;
  data.joins_length = joins_length;
  data.totlr_count = totlr_count;
  data.tot_count = tot_count;
  data.cnt_ins = cnt_ins;
  data.cnt_del = cnt_del;
  pgcallback(100);
  return data;
};

parse_joined = function() {
  var chunksize, feof, fpos, fstep, getchunk, line, nline, noncomplete_line, reader, readline;
  reader = new FileReader();
  chunksize = 1024 * 1024 * 10;
  noncomplete_line = '';
  fpos = 0;
  fstep = 200;
  nline = 0;
  feof = 0;
  getchunk = function() {
    var blob, endpos;
    if (fpos >= joinedfile.size) {
      feof = 1;
      readline();
    }
    if (fpos + chunksize >= joinedfile.size) {
      endpos = joinedfile.size;
    } else {
      endpos = fpos + chunksize;
    }
    blob = joinedfile.slice(fpos, endpos);
    fpos += endpos - fpos;
    return reader.readAsText(blob);
  };
  reader.onload = function() {
    var chunk_lines;
    chunk_lines = reader.result.replace(/\r\n|\n\r|\r/, '\n').split('\n');
    chunk_lines[0] = noncomplete_line + chunk_lines[0];
    noncomplete_line = chunk_lines[chunk_lines.length - 1];
    chunk_lines = chunk_lines.slice(0, chunk_lines.length - 1);
    return readline();
  };
  readline = function() {
    if (nline >= chunk_lines.length) {
      if (feof) {
        return '';
      } else {
        getchunk();
        return;
      }
    }
    return chunk_lines[nline++];
  };
  return line = readline();
};
